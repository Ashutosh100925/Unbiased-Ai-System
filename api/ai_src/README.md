# ⚖️ Unbiased AI Decision Intelligence System

A production-ready decoupled inference system designed to mitigate unconscious bias and mathematically guarantee fairness in Hiring, Loan Approvals, and College Admissions. Built natively using Scikit-Learn without depending on black-box external AI endpoints.

## 🚀 Key Features
* **Zero-API Policy:** Entire fairness computation logic happens natively on-device.
* **Three-Pillar Scoring:** Returns a Decision, a Confidence Score, and a Fairness Score on every query.
* **Algorithmic Disparate Impact Detection:** Flags real-time decisions that fall foul of the traditional 80% parity rule.
* **Feature Explainability:** Automatically extracts localized feature importance matrix for manual reviewer context. 

## 🧠 System Modularity
The codebase utilizes a `Bias Intercept Pattern`. 
`User Input` -> `Preprocessing` -> `Model Prediction` -> `WAIT: Divert to Bias Engine` -> `Analyze` -> `Format JSON Return`.

## 🔮 Future Scope
* **Local LLM Integration** using local binaries (like Llama.cpp) to generate natural-language paragraphs out from the mathematical feature weights.
* **Automated Reweighting Loop:** If the system detects bias dropping below 80% parity, it automatically triggers `bias_mitigation.py`, applies synthetic Class Balancing, and swaps out `model.pkl` with a new, fairer weight distribution.
