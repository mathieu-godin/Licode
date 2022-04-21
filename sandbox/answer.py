def makeSum(nums, target):
    return [1,2]

if __name__ == "__main__":
    target = int(input())
    n = int(input())
    nums = []
    for i in range(n):
        nums.append(int(input()))
    (start, end) = makeSum(nums, target)
    print(str(start), str(end))
