import sys

if __name__ == "__main__":
    n = int(input())
    print("Q", end="", file=sys.stderr)
    print(n, end="", file=sys.stderr)
    print("W", end="", file=sys.stderr)
    nums = []
    for i in range(n):
        qw = int(input())
        print("Q", end="", file=sys.stderr)
        print(qw, end="", file=sys.stderr)
        print("W", end="", file=sys.stderr)
        nums.append(qw)
    nums.sort()
    print(n)
    for i in range(n):
        print(nums[i])