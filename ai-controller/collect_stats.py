import requests
import csv
import time
from datetime import datetime, timezone

# --- Configuration ---
PROMETHEUS_URL = "http://localhost:9090"

# This dictionary holds the final, validated queries.
QUERIES = {
    "rps_per_pod": {
        # This query correctly uses destination_workload, which is now unique for each pod.
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
        # THIS IS THE CORRECTED QUERY
        # The regex "product-service-v.-deployment-.*" matches v1, v2, and v3 pods.
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
    """Sends a query to the Prometheus API and returns the result."""
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
    """Main function to run the data collection."""
    print(f"--- Starting data collection for '{experiment_name}' experiment ---")
    start_time = time.time()
    end_time = start_time + EXPERIMENT_DURATION_SECONDS

    output_files = {}
    try:
        # Create CSV files and write headers
        for name, details in QUERIES.items():
            filename = f"{experiment_name}_{name}.csv"
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
        
        print(f"--- Data collection for '{experiment_name}' finished. Results saved to {experiment_name}_*.csv files. ---")

if __name__ == "__main__":
    main("baseline")