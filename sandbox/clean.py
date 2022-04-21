import sys

if __name__ == "__main__":
    nums = []
    while True:
        try:
            tryNums = input().split()
        except:
            break
        nums = tryNums
    nums.sort()
    ret = ""
    if len(nums) > 0:
        ret += str(nums[0])
    for i in range(1, len(nums)):
        ret += " " + str(nums[i])
    print(ret)

