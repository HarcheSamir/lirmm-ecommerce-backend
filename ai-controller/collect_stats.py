import requests
import csv
import time
from datetime import datetime, timezone
import os
import sys # <-- ADD THIS LINE

# --- Configuration ---
PROMETHEUS_URL = "http://localhost:9090"
OUTPUT_DIR = "prometheus-stats"

# ... (The QUERIES dictionary remains the same) ...
QUERIES = {
    "rps_per_pod": {
        "query": 'sum(rate(istio_requests_total{reporter="destination", destination_workload=~"product-service-v.-deployment", namespace="lirmm-services"}[1m])) by (destination_workload)',
        "fields": ['timestamp', 'pod', 'value'],
        "label": "destination_workload"
    },
    "p99_latency_per_pod_ms": {
        "query": 'histogram_quantile(0.99, sum(rate(istio_request_duration_milliseconds_bucket{reporter="destination", destination_workload=~"product-service-v.-deployment", namespace="lirmm-services"}[1m])) by (le, destination_workload))',
        "fields": ['timestamp', 'pod', 'value'],
        "label": "destination_workload"
    },
    "cpu_usage_per_pod_cores": {
        "query": 'sum(rate(container_cpu_usage_seconds_total{namespace="lirmm-services", pod=~"product-service-v.-deployment-.*"}[1m])) by (pod)',
        "fields": ['timestamp', 'pod', 'value'],
        "label": "pod"
    },
    "error_rate_5xx_total": {
        "query": 'sum(rate(istio_requests_total{reporter="destination", destination_workload=~"product-service-v.-deployment", response_code=~"5.*"}[1m]))',
        "fields": ['timestamp', 'value'],
        "label": None
    }
}

# --- Experiment Parameters ---
EXPERIMENT_DURATION_SECONDS = 1800 # 30 minutes
SCRAPE_INTERVAL_SECONDS = 15

def query_prometheus(query):
    # ... (This function remains the same) ...
    try:
        url = f"{PROMETHEUS_URL}/api/v1/query"
        response = requests.get(url, params={'query': query})
        response.raise_for_status()
        data = response.json()
        if data['status'] == 'success':
            return data['data']['result']
        else:
            print(f"Prometheus query failed with status: {data['status']}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Error querying Prometheus: {e}")
        return []

def main(experiment_name="baseline"):
    # ... (This function remains the same) ...
    print(f"--- Starting data collection for '{experiment_name}' experiment ---")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Saving output files to: ./{OUTPUT_DIR}/")
    
    start_time = time.time()
    end_time = start_time + EXPERIMENT_DURATION_SECONDS

    output_files = {}
    try:
        for name, details in QUERIES.items():
            filename = os.path.join(OUTPUT_DIR, f"{experiment_name}_{name}.csv")
            f = open(filename, 'w', newline='')
            writer = csv.DictWriter(f, fieldnames=details['fields'])
            writer.writeheader()
            output_files[name] = {'file': f, 'writer': writer, 'details': details}

        print(f"Output files created. Running for {EXPERIMENT_DURATION_SECONDS / 60:.1f} minutes...")

        while time.time() < end_time:
            current_timestamp = datetime.now(timezone.utc).isoformat()
            
            for name, data in output_files.items():
                query_details = data['details']
                results = query_prometheus(query_details['query'])

                if not results:
                    if name == "error_rate_5xx_total":
                        data['writer'].writerow({'timestamp': current_timestamp, 'value': 0.0})
                    continue

                for result in results:
                    row = {'timestamp': current_timestamp}
                    value = result['value'][1]

                    if query_details['label']:
                        pod_name = result['metric'].get(query_details['label'], 'unknown')
                        row['pod'] = pod_name
                        row['value'] = value
                    else:
                        row['value'] = value
                    
                    data['writer'].writerow(row)

            remaining_time = int(end_time - time.time())
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Scrape complete. Time remaining: {remaining_time // 60}m {remaining_time % 60}s")
            time.sleep(SCRAPE_INTERVAL_SECONDS)

    finally:
        for name, data in output_files.items():
            if 'file' in data and data['file']:
                data['file'].close()
        
        print(f"--- Data collection for '{experiment_name}' finished. Results saved inside ./{OUTPUT_DIR}/ directory. ---")


if __name__ == "__main__":
    # --- THIS IS THE CHANGED SECTION ---
    # Check if a command-line argument for the experiment name was provided.
    # sys.argv[0] is the script name itself, sys.argv[1] is the first argument.
    if len(sys.argv) > 1:
        exp_name = sys.argv[1]
    else:
        # If no argument is provided, default to "baseline".
        exp_name = "baseline"
    
    main(exp_name)
    # --- END OF CHANGED SECTION ---