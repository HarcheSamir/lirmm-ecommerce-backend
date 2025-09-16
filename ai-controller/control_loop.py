import time
import os
from kubernetes import client, config
from prometheus_api_client import PrometheusConnect
from agent import QLearningAgent

# --- Configuration ---
# Kubernetes and Istio configuration
NAMESPACE = "lirmm-services"
VIRTUAL_SERVICE_NAME = "product-service-vs" # The VS we will be patching

# Prometheus configuration
PROMETHEUS_URL = "http://localhost:9090" # Assumes you are port-forwarding

# Experiment configuration
CONTROL_LOOP_INTERVAL = 20  # seconds between decisions
POD_VERSIONS = ['v1', 'v2', 'v3']

# --- Helper Functions ---

def get_latency_from_prometheus(prom):
    """
    Queries Prometheus to get the current P99 latency for each pod version.

    Returns:
        dict: A dictionary mapping pod version to its latency, e.g., {'v1': 150.5, ...}
              Returns None if the query fails.
    """
    try:
        query = f'histogram_quantile(0.99, sum(rate(istio_request_duration_milliseconds_bucket{{reporter="destination", destination_workload=~"product-service-v.-deployment", namespace="{NAMESPACE}"}}[1m])) by (le, destination_workload))'
        results = prom.custom_query(query)
        
        latencies = {}
        for result in results:
            workload = result['metric']['destination_workload']
            for version in POD_VERSIONS:
                if version in workload:
                    latencies[version] = float(result['value'][1])
        
        # Ensure all versions are present, default to a high value if a pod is not reporting
        for version in POD_VERSIONS:
            if version not in latencies:
                latencies[version] = 1000.0 # High default for missing pods
                
        return latencies
    except Exception as e:
        print(f"ERROR: Could not fetch metrics from Prometheus: {e}")
        return None

def update_virtual_service_weights(k8s_api, weights):
    """
    Patches the Istio VirtualService with new traffic routing weights.

    Args:
        k8s_api: An instance of the Kubernetes custom objects API client.
        weights (tuple): A tuple of three integers representing the new weights, e.g., (70, 15, 15).
    """
    try:
        # Define the patch payload
        patch = {
            "spec": {
                "http": [
                    {
                        "route": [
                            {"destination": {"host": "product-service-svc", "subset": "v1"}, "weight": weights[0]},
                            {"destination": {"host": "product-service-svc", "subset": "v2"}, "weight": weights[1]},
                            {"destination": {"host": "product-service-svc", "subset": "v3"}, "weight": weights[2]},
                        ]
                    }
                ]
            }
        }

        # Apply the patch
        k8s_api.patch_namespaced_custom_object(
            group="networking.istio.io",
            version="v1alpha3",
            name=VIRTUAL_SERVICE_NAME,
            namespace=NAMESPACE,
            plural="virtualservices",
            body=patch,
        )
        print(f"INFO: VirtualService '{VIRTUAL_SERVICE_NAME}' patched with weights: v1={weights[0]}, v2={weights[1]}, v3={weights[2]}")
    except Exception as e:
        print(f"ERROR: Failed to patch VirtualService: {e}")


def calculate_reward(latencies):
    """
    Calculates a reward based on the overall system latency.
    Lower latency results in a higher (better) reward.

    Args:
        latencies (dict): The current latency dictionary.

    Returns:
        float: The calculated reward.
    """
    # Simple reward function: inverse of the average latency.
    # We add 1 to avoid division by zero.
    avg_latency = sum(latencies.values()) / len(latencies)
    reward = 1.0 / (avg_latency + 1.0)
    return reward


# --- Main Control Loop ---

def main():
    """The main control loop for the Q-Learning Load Balancer."""
    print("--- Starting AI Load Balancer Controller ---")

    # --- Initialize Connections ---
    # Connect to Kubernetes API
    try:
        config.load_kube_config() 
        k8s_custom_api = client.CustomObjectsApi()
        print("INFO: Successfully connected to Kubernetes API.")
    except Exception as e:
        print(f"FATAL: Could not connect to Kubernetes API: {e}")
        return

    # Connect to Prometheus
    try:
        prom = PrometheusConnect(url=PROMETHEUS_URL, disable_ssl=True)
        print("INFO: Successfully connected to Prometheus.")
    except Exception as e:
        print(f"FATAL: Could not connect to Prometheus at {PROMETHEUS_URL}. Is it port-forwarded?")
        return

    # --- Initialize AI Agent ---
    agent = QLearningAgent()
    print("INFO: Q-Learning agent initialized.")
    print(f"INFO: State space size = {agent.q_table.shape[:-1]}, Action space size = {agent.num_actions}")

    # --- Get Initial State ---
    initial_latencies = get_latency_from_prometheus(prom)
    if not initial_latencies:
        print("FATAL: Could not get initial state from Prometheus. Exiting.")
        return
    current_state = agent.discretize_state(initial_latencies)

    print("--- Control Loop Started ---")
    iteration = 0
    while True:
        iteration += 1
        print(f"\n--- Iteration {iteration} ---")
        
        # 1. DECIDE: Choose an action based on the current state
        action_index = agent.choose_action(current_state)
        action_weights = agent.actions[action_index]
        print(f"INFO: Current state: {current_state}. Epsilon: {agent.epsilon:.3f}")
        print(f"INFO: Chosen action index: {action_index} -> Weights: {action_weights}")

        # 2. ACT: Apply the chosen weights to the VirtualService
        update_virtual_service_weights(k8s_custom_api, action_weights)
        
        # 3. WAIT: Allow time for the system to react to the change
        print(f"INFO: Waiting for {CONTROL_LOOP_INTERVAL} seconds...")
        time.sleep(CONTROL_LOOP_INTERVAL)

        # 4. OBSERVE & REWARD: Get the new state and calculate the reward
        new_latencies = get_latency_from_prometheus(prom)
        if not new_latencies:
            print("WARN: Skipping learning step due to Prometheus query failure.")
            continue
            
        reward = calculate_reward(new_latencies)
        next_state = agent.discretize_state(new_latencies)
        print(f"INFO: New latencies: { {k: f'{v:.2f}ms' for k, v in new_latencies.items()} }")
        print(f"INFO: Reward calculated: {reward:.4f}")

        # 5. LEARN: Update the agent's Q-Table
        agent.update_q_table(current_state, action_index, reward, next_state)
        print("INFO: Q-Table updated.")

        # Prepare for the next iteration
        current_state = next_state


if __name__ == "__main__":
    main()