def makeSum(nums, target):
    idxs = sorted(range(len(nums)), key=lambda x: nums[x])
    start = 0
    end = len(nums) - 1
    while True:
        if (nums[idxs[start]] + nums[idxs[end]]) == target:
            return (0, 0)
        elif (nums[idxs[start]] + nums[idxs[end]]) < target:
            start += 1
        else:
            end -= 1


if __name__ == "__main__":
    target = int(input())
    n = int(input())
    nums = []
    for i in range(n):
        nums.append(int(input()))
    (start, end) = makeSum(nums, target)
    print(str(start), str(end))
