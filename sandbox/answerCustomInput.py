def arrangementSumPossibleIntegers(integers, arrangementSum):
    print("hello world")
    return [[1,2],[3,4]]

import sys

if __name__ == "__main__":
    n0 = int(input())
    print("G", end="", file=sys.stderr)
    print(n0, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    p0 = []
    nums = []
    for i in range(n0):
        gh = int(input())
        print("G", end="", file=sys.stderr)
        print(gh, end="", file=sys.stderr)
        print("H", end="", file=sys.stderr)
        nums.append(gh)
    p1 = int(input())
    print("G", end="", file=sys.stderr)
    print(p1, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    result = arrangementSumPossibleIntegers(p0, p1)
