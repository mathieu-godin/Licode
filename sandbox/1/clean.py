

if __name__ == "__main__":
    while True:
        tryInput = input()
        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):
            break
    n = int(input())
    nums = []
    for i in range(n):
        nums.append(int(input()))
    nums.sort()
    print(n)
    for i in range(n):
        print(nums[i])