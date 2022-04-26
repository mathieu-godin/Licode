

if __name__ == "__main__":
    while True:
        tryInput = input()
        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):
            break
    n = int(input())
    nns = []
    nums = []
    for i in range(n):
        nn = int(input())
        nns.append(nn)
        nnums = []
        for j in range(nn):
            nnums.append(int(input()))
        nnums.sort()
        nums.append(nnums)
    nums.sort()
    print(n)
    for i in range(n):
        print(nns[i])
        for j in range(nns[i]):
            print(nums[i][j])
