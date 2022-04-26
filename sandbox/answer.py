def pairSumIndices(integers, pairSum):
    i = 0
    while i < len(integers):
        j = 0
        while j < len(integers):
            if i != j and integers[i] + integers[j] == pairSum:
                return [i, j]
            j += 1
        i += 1

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
    result = pairSumIndices(p0, p1)
    print("v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB")
    print(len(result))
    for r in result:
        print(r)
