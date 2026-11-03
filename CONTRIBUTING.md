# Contributing to UnimaxDL

First off, thank you for considering contributing to UnimaxDL! It's people like you that make UnimaxDL such a great tool for the community.

## Code of Conduct
This project and everyone participating in it is governed by the [UnimaxDL Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/UnimaxDL/unimaxdl.github.io/issues).
- If you're unable to find an open issue addressing the problem, open a new one using the **Bug Report** template.
- Include a clear title, description, steps to reproduce, and sample video URL (if safe).

### Suggesting Enhancements
- Check if your idea is already proposed in [Discussions](https://github.com/UnimaxDL/unimaxdl.github.io/discussions).
- Open a new feature request describing the user story and suggested API/UI changes.

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/UnimaxDL/unimaxdl.github.io.git
   cd unimaxdl.github.io
   ```

2. **Run the local Python server:**
   ```bash
   cd server
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python start.py
   ```

3. **Open the Web UI:**
   Navigate to `http://127.0.0.1:8000` in your web browser.

### Pull Request Process
1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/my-amazing-feature
   ```
2. Commit your changes with clear, descriptive commit messages.
3. Push to your fork and submit a Pull Request.
4. One of the maintainers will review your PR promptly!
