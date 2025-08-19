import numpy as np
import random

class QLearningAgent:
    """
    A class to implement a Q-Learning agent for load balancing.
    This agent learns a policy to distribute traffic across three pods (v1, v2, v3)
    based on their performance (latency and CPU).
    """
    def __init__(self, learning_rate=0.1, discount_factor=0.9, exploration_rate=1.0, exploration_decay=0.995):
        """
        Initializes the agent and its Q-Table.

        Args:
            learning_rate (float): Alpha. How much we update Q-values based on new info.
            discount_factor (float): Gamma. The importance of future rewards.
            exploration_rate (float): Epsilon. Initial probability of choosing a random action.
            exploration_decay (float): Rate at which epsilon decays after each decision.
        """
        # --- Hyperparameters ---
        self.alpha = learning_rate
        self.gamma = discount_factor
        self.epsilon = exploration_rate
        self.epsilon_min = 0.01
        self.epsilon_decay = exploration_decay

        # --- State Space Definition ---
        # We discretize continuous metrics into 3 levels: 0=LOW, 1=MEDIUM, 2=HIGH
        # We will use Latency as our primary signal.
        # State is a tuple representing the latency level of each pod: (v1_latency, v2_latency, v3_latency)
        # Example state: (HIGH, LOW, LOW) which we will map to (2, 0, 0)
        self.num_latency_levels = 3  # LOW, MEDIUM, HIGH

        # --- Action Space Definition ---
        # We define a small, discrete set of actions the agent can take.
        self.actions = [
            (70, 15, 15),  # Heavily favor v1
            (15, 70, 15),  # Heavily favor v2
            (15, 15, 70),  # Heavily favor v3
            (34, 33, 33),  # Balance traffic evenly (default)
            (50, 50, 0),   # Deactivate v3, split between v1, v2
            (50, 0, 50),   # Deactivate v2, split between v1, v3
            (0, 50, 50),   # Deactivate v1, split between v2, v3
        ]
        self.num_actions = len(self.actions)

        # --- Q-Table Initialization ---
        # The Q-Table stores the expected long-term reward for taking a specific action in a specific state.
        # Dimensions: (v1_latency_levels, v2_latency_levels, v3_latency_levels, num_actions)
        q_table_dims = (self.num_latency_levels, self.num_latency_levels, self.num_latency_levels, self.num_actions)
        
        # We initialize the table with zeros. The agent starts with no knowledge.
        self.q_table = np.zeros(q_table_dims)

    def discretize_state(self, latencies):
        """
        Converts continuous latency values into discrete state representation.

        Args:
            latencies (dict): A dictionary mapping pod version to its latency. 
                              e.g., {'v1': 280, 'v2': 150, 'v3': 160}
        
        Returns:
            tuple: A tuple representing the discrete state, e.g., (2, 1, 1)
        """
        # --- These thresholds are critical and can be tuned ---
        # Anything below 200ms is considered good performance.
        LOW_LATENCY_THRESHOLD = 200  # ms
        # Anything above 400ms is considered poor performance.
        HIGH_LATENCY_THRESHOLD = 400 # ms
        
        state = []
        for version in ['v1', 'v2', 'v3']:
            latency = latencies.get(version, HIGH_LATENCY_THRESHOLD) # Default to HIGH if data is missing
            if latency < LOW_LATENCY_THRESHOLD:
                state.append(0)  # LOW
            elif latency < HIGH_LATENCY_THRESHOLD:
                state.append(1)  # MEDIUM
            else:
                state.append(2)  # HIGH
        return tuple(state)

    def choose_action(self, state):
        """
        Chooses an action using an epsilon-greedy strategy.

        Args:
            state (tuple): The current discrete state of the system.

        Returns:
            int: The index of the chosen action in self.actions.
        """
        # --- Exploration vs. Exploitation ---
        if random.uniform(0, 1) < self.epsilon:
            # EXPLORE: Choose a random action to discover its outcome.
            return random.randint(0, self.num_actions - 1)
        else:
            # EXPLOIT: Choose the best action learned so far for this state.
            # np.argmax returns the index of the maximum value in the array.
            return np.argmax(self.q_table[state])

    def update_q_table(self, state, action, reward, next_state):
        """
        Updates the Q-Table using the Bellman equation. This is the core learning step.

        Args:
            state (tuple): The state before the action was taken.
            action (int): The index of the action that was taken.
            reward (float): The reward received after taking the action.
            next_state (tuple): The new state of the system after the action.
        """
        # Get the current Q-value for the state-action pair
        old_value = self.q_table[state][action]
        
        # Find the maximum Q-value for the next state (the best possible future reward)
        next_max = np.max(self.q_table[next_state])
        
        # --- The Bellman Equation ---
        # new_value = (1 - alpha) * old_value + alpha * (reward + gamma * next_max)
        # It's a weighted average between the old value and the newly learned value.
        new_value = (1 - self.alpha) * old_value + self.alpha * (reward + self.gamma * next_max)
        
        # Update the Q-Table with the new value
        self.q_table[state][action] = new_value

        # --- Decay Epsilon ---
        # As the agent learns, we reduce the chance of it taking a random action.
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay