def eachBinaryDigitDifferentFromItsNeighbours(integer):
    bits = []
    while integer > 0:
        bits.append(integer % 2)
        integer = int(integer / 2)
    if len(bits) < 2:
        return 1
    if len(bits) == 2:
        return bits[0] ^ bits[1]
    for i in range(1, len(bits) - 1):
        if bits[i] == bits[i-1] or bits[i] == bits[i + 1]:
            return 0
    return 1

import sys

if __name__ == "__main__":
    p0 = int(input())
    print("G", end="", file=sys.stderr)
    print(p0, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    result = eachBinaryDigitDifferentFromItsNeighbours(p0)
