import sys

if __name__ == "__main__":
    while True:
        tryInput = input()
        print("OK", end="", file=sys.stderr)
        print(tryInput, end="", file=sys.stderr)
        print("PL", end="", file=sys.stderr)
        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):
            break
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