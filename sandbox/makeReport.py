import subprocess

containerID= subprocess.check_output("docker run -dit py-sandbox", shell=True).decode("utf-8").replace('\n', '')

#print("Container ID", containerID)

subprocess.run(["docker", "cp", "TestInputs/", containerID + ":home/TestEnvironment/TestInputs/"])
subprocess.run(["docker", "cp", "TestOutputs/", containerID + ":home/TestEnvironment/TestOutputs/"])
subprocess.run(["docker", "cp", "answer.py", containerID + ":home/TestEnvironment/answer.py"])
subprocess.run(["docker", "cp", "clean.py", containerID + ":home/TestEnvironment/clean.py"])

subprocess.run("docker exec " + containerID + " sh -c \"cd home/TestEnvironment/ && ./makeReport.sh\"")

subprocess.run("docker cp " + containerID + ":home/TestEnvironment/report.txt reportFromPySandbox.txt")

subprocess.run("docker kill " + containerID)

subprocess.run("docker rm " + containerID)