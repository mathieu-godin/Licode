def palindrome(integer):
    return 1

import sys

if __name__ == "__main__":
    p0 = int(input())
    print("G", end="", file=sys.stderr)
    print(p0, end="", file=sys.stderr)
    print("H", end="", file=sys.stderr)
    result = palindrome(p0)
