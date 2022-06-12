def arrangementSumPossibleIntegers(integers, arrangementSum):
    temp = []
    ans = []
    arrangementSumPossibleIntegersRecursion(integers, 0, arrangementSum, temp, ans)
    return ans

def arrangementSumPossibleIntegersRecursion(integers, i, arrangementSum, temp, ans):
    if arrangementSum == 0:
        ans.append(temp.copy())
        return
    if i == len(integers):
        return
    if integers[i] <= arrangementSum:
        temp.append(integers[i])
        arrangementSumPossibleIntegersRecursion(integers, i, arrangementSum - integers[i], temp, ans)
        temp.pop()
    arrangementSumPossibleIntegersRecursion(integers, i + 1, arrangementSum, temp, ans)

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
    p1 = int(input())
    print("G", end="", file=sys.stderr)
    print(p1, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    result = arrangementSumPossibleIntegers(p0, p1)
