https://htmlpreview.github.io/?https://raw.githubusercontent.com/Galactyce/FunnyGame/master/index.html

## VS Code Run Note

Run this project from a local server in VS Code (Terminal), not by opening `index.html` with `file://`.

### Quick start (Python)

1. Open the VS Code terminal in this project folder.
2. Run:

```bash
python -m http.server 8080
```

3. Open:

http://localhost:8080/

This avoids browser file-origin security errors and ensures assets load correctly.
