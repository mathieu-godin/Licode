def arrangementSumPossibleIntegers(integers, arrangementSum):
    temp = []
    ans = []
    arrangementSumPossibleIntegersRecursion(integers, 0, arrangementSum, temp, ans)
    return ans

def arrangementSumPossibleIntegersRecursion(integers, i, arrangementSum, temp, ans):
    if arrangementSum == 0:
        ans.append(temp.copy())
        return
    if i == len(integers):
        return
    if integers[i] <= arrangementSum:
        temp.append(integers[i])
        arrangementSumPossibleIntegersRecursion(integers, i, arrangementSum - integers[i], temp, ans)
        temp.pop()
    arrangementSumPossibleIntegersRecursion(integers, i + 1, arrangementSum, temp, ans)