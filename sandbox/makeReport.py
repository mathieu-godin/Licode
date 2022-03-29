from subprocess import Popen, PIPE, check_call

getContainerId = Popen(["docker", "run", "-dit", "py-sandbox"], stdout=PIPE, stdin=PIPE)
containerID = getContainerId.communicate()[0].decode('utf-8').strip()

print("Container ID", containerID)

check_call(["docker", "cp", "TestInputs/", containerID + ":home/TestEnvironment/TestInputs/"], stdout=PIPE)
check_call(["docker", "cp", "TestOutputs/", containerID + ":home/TestEnvironment/TestOutputs/"], stdout=PIPE)
check_call(["docker", "cp", "answer.py", containerID + ":home/TestEnvironment/answer.py"], stdout=PIPE)
check_call(["docker", "cp", "clean.py", containerID + ":home/TestEnvironment/clean.py"], stdout=PIPE)

check_call(["docker", "exec", containerID, "sh", "-c", "cd home/TestEnvironment/ && ./makeReport.sh"], stdout=PIPE)

check_call(["docker", "cp", containerID + ":home/TestEnvironment/report.txt", "reportFromPySandbox.txt"], stdout=PIPE)

check_call(["docker", "kill", containerID], stdout=PIPE)

check_call(["docker", "rm", containerID], stdout=PIPE)