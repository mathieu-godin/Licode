from math import sqrt

def primeFactorsLimitedTo3And7(integer):
    for i in range(2, min(integer + 1, 1000000)):
        if i != 3 and i != 7 and i % 3 != 0 and i % 7 != 0 and integer % i == 0:
            return 0
    return 1

import sys

if __name__ == "__main__":
    p0 = int(input())
    print("G", end="", file=sys.stderr)
    print(p0, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    result = primeFactorsLimitedTo3And7(p0)
