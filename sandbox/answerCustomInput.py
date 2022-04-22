def makeSum(nums, target):
    i = 0
    while i < len(nums):
        j = 0
        while j < len(nums):
            if i != j and nums[i] + nums[j] == target:
                return [i, j]
            j += 1
        i += 1

if __name__ == "__main__":
    target = int(input())
    n = int(input())
    nums = []
    for i in range(n):
        nums.append(int(input()))
    (start, end) = makeSum(nums, target)
