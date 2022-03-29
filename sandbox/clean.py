import sys

if __name__ == "__main__":
    nums = input().split()
    nums.sort()
    ret = ""
    if len(nums) > 0:
        ret += str(nums[0])
    for i in range(1, len(nums)):
        ret += " " + str(nums[i])
    print(ret)

