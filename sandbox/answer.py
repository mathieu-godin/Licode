def findNotDuplicatedInteger(integers):
    print(integers)
    i = 0
    while i < len(integers):
        j = 0
        notDuplicated = True
        while j < len(integers):
            if i != j and integers[i] == integers[j]:
                notDuplicated = False
                break
            j += 1
        if notDuplicated:
            return integers[i]
        i += 1

import sys

if __name__ == "__main__":
    n0 = int(input())
    print("G", end="", file=sys.stderr)
    print(n0, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    p0 = []
    for i in range(n0):
        gh = int(input())
        print("G", end="", file=sys.stderr)
        print(gh, end="", file=sys.stderr)
        print("H", end="", file=sys.stderr)
        p0.append(gh)
    result = findNotDuplicatedInteger(p0)
    print("v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB")
    print(result)
