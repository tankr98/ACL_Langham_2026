import subprocess
import os

print("Running firebase deploy via python...")
env = os.environ.copy()
env["CI"] = "true"
env["FIREBASE_TOKEN"] = "" # If they have global login, it uses configstore token automatically

try:
    p = subprocess.Popen(
        [r".\firebase.exe", "deploy", "--only", "hosting", "--non-interactive"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
        shell=True
    )
    stdout, stderr = p.communicate(timeout=60)
    print("Return code:", p.returncode)
    print("STDOUT:")
    print(stdout)
    print("STDERR:")
    print(stderr)
except Exception as e:
    print("Execution error:", e)
