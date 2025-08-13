# ai-controller/reader.py

import requests
import json
import time
import os
import pandas as pd
from datetime import datetime

# ==============================================================================
#  CONFIGURATION
# ==============================================================================
PROMETHEUS_URL = 'http://localhost:9090/api/v1/query'

# ==============================================================================
#  FINAL, CORRECTED QUERIES
# ==============================================================================
# These queries are now more robust. Instead of relying on the 'destination_workload'
# label, which was causing issues, we directly target pods belonging to the
# known-correct service name and the statefulset pattern.

METRIC_QUERIES = {
    # CPU and Memory queries are pod-specific and should be correct.
    'cpu_usage': 'rate(container_cpu_usage_seconds_total{namespace="lirmm-services", pod=~"order-service-statefulset-.*"}[1m])',
    'memory_usage_mb': 'container_memory_working_set_bytes{namespace="lirmm-services", pod=~"order-service-statefulset-.*"} / 1024 / 1024',

    # Istio metrics are now queried by targeting the service name and then grouping by pod.
    'request_rate_rps': 'sum(rate(istio_requests_total{destination_service_name="order-service-svc", reporter="destination"}[1m])) by (pod_name)',
    'p95_latency_ms': 'histogram_quantile(0.95, sum(rate(istio_request_duration_milliseconds_bucket{destination_service_name="order-service-svc", reporter="destination"}[1m])) by (le, pod_name))'
}

# ==============================================================================
#  CORE FUNCTION
# ==============================================================================
def get_pod_metrics():
    all_metrics_data = {}
    for metric_name, query in METRIC_QUERIES.items():
        try:
            response = requests.get(PROMETHEUS_URL, params={'query': query})
            response.raise_for_status()
            results = response.json()['data']['result']
            for result in results:
                # The label for pod name in Istio metrics is 'pod_name'
                pod_name = result['metric'].get('pod_name') or result['metric'].get('pod')
                if not pod_name or "order-service-statefulset" not in pod_name:
                    continue # Skip metrics that don't belong to our target pods

                if pod_name not in all_metrics_data:
                    all_metrics_data[pod_name] = {}
                value = float(result['value'][1])
                all_metrics_data[pod_name][metric_name] = value
        except requests.exceptions.RequestException as e:
            return {'error': f"Connection to Prometheus failed: {e}"}
        except (KeyError, IndexError):
            continue
    
    if not all_metrics_data:
        return None
        
    df = pd.DataFrame(all_metrics_data).T 
    return df

# ==============================================================================
#  MAIN EXECUTION BLOCK
# ==============================================================================
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

if __name__ == "__main__":
    print("--- Starting LIVE Multi-Metric Monitor ---")
    print("Targeting service: order-service-svc")
    print("Press CTRL+C to stop.")
    time.sleep(2)

    try:
        while True:
            metrics_df = get_pod_metrics()
            clear_screen()
            
            print(f"--- Live Pod Health Monitor --- (Last updated: {datetime.now().strftime('%H:%M:%S')})")
            
            if isinstance(metrics_df, dict) and 'error' in metrics_df:
                print(f"\n❌ [ERROR] {metrics_df['error']}")
            elif metrics_df is None or metrics_df.empty:
                print("\n... Waiting for data ... (Is the load test running?)")
            else:
                expected_cols = list(METRIC_QUERIES.keys())
                for col in expected_cols:
                    if col not in metrics_df.columns:
                        metrics_df[col] = 0.0
                
                metrics_df = metrics_df.reindex(columns=expected_cols).fillna(0.0)
                
                display_df = metrics_df.copy()
                display_df['cpu_usage'] = display_df['cpu_usage'].map('{:.2%}'.format)
                display_df['memory_usage_mb'] = display_df['memory_usage_mb'].map('{:.2f} MB'.format)
                display_df['request_rate_rps'] = display_df['request_rate_rps'].map('{:.2f} rps'.format)
                display_df['p95_latency_ms'] = display_df['p95_latency_ms'].map('{:.2f} ms'.format)
                
                print("\n✅ --- order-service Health --- ✅")
                print(display_df.to_string())
                print("-" * 80)

            time.sleep(5)

    except KeyboardInterrupt:
        print("\n--- Monitor stopped by user. ---")