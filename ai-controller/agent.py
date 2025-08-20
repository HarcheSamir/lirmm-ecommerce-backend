import numpy as np
import random

class QLearningAgent:
    """
    A class to implement a Q-Learning agent for load balancing.
    This agent learns a policy to distribute traffic across three pods (v1, v2, v3)
    based on their performance (latency and CPU).
    """
    # --- THIS IS THE ONLY LINE THAT HAS BEEN CHANGED ---
    def __init__(self, learning_rate=0.2, discount_factor=0.9, exploration_rate=1.0, exploration_decay=0.99):
        """
        Initializes the agent and its Q-Table.

        Args:
            learning_rate (float): Alpha. How much we update Q-values based on new info. (Increased from 0.1)
            discount_factor (float): Gamma. The importance of future rewards.
            exploration_rate (float): Epsilon. Initial probability of choosing a random action.
            exploration_decay (float): Rate at which epsilon decays after each decision. (Increased from 0.995)
        """
        # --- Hyperparameters ---
        self.alpha = learning_rate
        self.gamma = discount_factor
        self.epsilon = exploration_rate
        self.epsilon_min = 0.01
        self.epsilon_decay = exploration_decay

        # --- State Space Definition ---
        self.num_latency_levels = 3  # LOW, MEDIUM, HIGH

        # --- Action Space Definition ---
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
        q_table_dims = (self.num_latency_levels, self.num_latency_levels, self.num_latency_levels, self.num_actions)
        self.q_table = np.zeros(q_table_dims)

    def discretize_state(self, latencies):
        """
        Converts continuous latency values into discrete state representation.
        """
        LOW_LATENCY_THRESHOLD = 200  # ms
        HIGH_LATENCY_THRESHOLD = 400 # ms
        
        state = []
        for version in ['v1', 'v2', 'v3']:
            latency = latencies.get(version, HIGH_LATENCY_THRESHOLD) 
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
        """
        if random.uniform(0, 1) < self.epsilon:
            return random.randint(0, self.num_actions - 1)
        else:
            return np.argmax(self.q_table[state])

    def update_q_table(self, state, action, reward, next_state):
        """
        Updates the Q-Table using the Bellman equation.
        """
        old_value = self.q_table[state][action]
        next_max = np.max(self.q_table[next_state])
        new_value = (1 - self.alpha) * old_value + self.alpha * (reward + self.gamma * next_max)
        self.q_table[state][action] = new_value

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay