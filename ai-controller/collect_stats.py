import requests
import csv
import time
from datetime import datetime, timezone

# --- Configuration ---
# This should be the address of your Prometheus service.
# If running this script outside the cluster, you need to port-forward Prometheus first:
# kubectl port-forward -n istio-system service/prometheus 9090:9090
PROMETHEUS_URL = "http://localhost:9090"

# This dictionary holds the final, validated queries.
QUERIES = {
    "rps_per_pod": {
        "query": 'sum(rate(istio_requests_total{reporter="destination", destination_workload=~"product-service.*", namespace="lirmm-services"}[1m])) by (destination_workload)',
        "fields": ['timestamp', 'pod', 'value'],
        "label": "destination_workload"
    },
    "p99_latency_per_pod_ms": {
        "query": 'histogram_quantile(0.99, sum(rate(istio_request_duration_milliseconds_bucket{reporter="destination", destination_workload=~"product-service.*", namespace="lirmm-services"}[1m])) by (le, destination_workload))',
        "fields": ['timestamp', 'pod', 'value'],
        "label": "destination_workload"
    },
    "cpu_usage_per_pod_cores": {
        # This query is designed to work for both v1 and v2 deployments
        "query": 'sum(rate(container_cpu_usage_seconds_total{namespace="lirmm-services", pod=~"product-service-.*"}[1m])) by (pod)',
        "fields": ['timestamp', 'pod', 'value'],
        "label": "pod"
    },
    "error_rate_5xx_total": {
        "query": 'sum(rate(istio_requests_total{reporter="destination", destination_workload=~"product-service.*", response_code=~"5.*"}[1m]))',
        "fields": ['timestamp', 'value'],
        "label": None # This query has no 'by' clause, so no label
    }
}

# --- Experiment Parameters ---
# Set the total duration of your experiment in seconds (e.g., 1800 for 30 minutes)
EXPERIMENT_DURATION_SECONDS = 1800
# Set how often to scrape Prometheus in seconds
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
    """
    Main function to run the data collection.
    - experiment_name: A prefix for the output files (e.g., 'baseline', 'ai_enabled')
    """
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
            
            # --- Scrape all configured metrics ---
            for name, data in output_files.items():
                query_details = data['details']
                results = query_prometheus(query_details['query'])

                if not results:
                    # This is expected for the 5xx query if there are no errors
                    if name == "error_rate_5xx_total":
                        # Write a zero value to indicate no errors at this timestamp
                        data['writer'].writerow({'timestamp': current_timestamp, 'value': 0.0})
                    continue

                for result in results:
                    row = {'timestamp': current_timestamp}
                    value = result['value'][1] # The value is the second item in the list ['timestamp', 'value']

                    if query_details['label']:
                        # This is a per-pod metric
                        pod_name = result['metric'].get(query_details['label'], 'unknown')
                        row['pod'] = pod_name
                        row['value'] = value
                    else:
                        # This is a service-wide metric
                        row['value'] = value
                    
                    data['writer'].writerow(row)

            remaining_time = int(end_time - time.time())
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Scrape complete. Time remaining: {remaining_time // 60}m {remaining_time % 60}s")
            time.sleep(SCRAPE_INTERVAL_SECONDS)

    finally:
        # --- Clean up and close all files ---
        for name, data in output_files.items():
            if data['file']:
                data['file'].close()
        
        print(f"--- Data collection for '{experiment_name}' finished. Results saved to {experiment_name}_*.csv files. ---")

if __name__ == "__main__":
    # You can change the name here for different experiments
    # e.g., main("ai_q_learning_run1")
    main("baseline")