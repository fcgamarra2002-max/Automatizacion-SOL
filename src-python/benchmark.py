import time
import subprocess
import json

def benchmark(cmd):
    start = time.time()
    result = subprocess.run(
        ["dist\\sunat-sidecar.exe", *cmd],
        capture_output=True,
        text=True
    )
    end = time.time()
    print(f"Command {' '.join(cmd)} took {end - start:.4f} seconds")
    # print(result.stdout)

if __name__ == "__main__":
    db_path = "data/empresas.accdb"
    # Benchmark multiple times to see if it fluctuates
    for _ in range(3):
        benchmark(["list-empresas", "--db", db_path])
