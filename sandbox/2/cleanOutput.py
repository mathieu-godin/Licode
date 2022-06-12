import sys
import functools

def compareNns(x, y):
    if x[0] > y[0]:
        return 1
    elif x[0] < y[0]:
        return -1
    else:
        for i in range(x[0]):
            if x[1][i] > y[1][i]:
                return 1
            if x[1][i] < y[1][i]:
                return -1
    return 0

if __name__ == "__main__":
    n = int(input())
    print("Q", end="", file=sys.stderr)
    print(n, end="", file=sys.stderr)
    print("W", end="", file=sys.stderr)
    nns = []
    nums = []
    for i in range(n):
        nn = int(input())
        print("Q", end="", file=sys.stderr)
        print(nn, end="", file=sys.stderr)
        print("W", end="", file=sys.stderr)
        nns = nns.copy()
        nns = []
        nns.append(nn)
        nnums = []
        for j in range(nn):
            qw = int(input())
            print("Q", end="", file=sys.stderr)
            print(qw, end="", file=sys.stderr)
            print("W", end="", file=sys.stderr)
            nnums.append(qw)
        nnums.sort()
        nns.append(nnums)
        nums.append(nns)
    nums.sort(key = functools.cmp_to_key(compareNns))
    print(n)
    for i in range(n):
        print(nums[i][0])
        for j in range(len(nums[i][1])):
            print(nums[i][1][j])
