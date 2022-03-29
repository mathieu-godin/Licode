#!/bin/bash

(cat stub.py) >> answer.py

containerID=$(docker run -dit py-sandbox)
#echo $containerID
docker cp TestInputs/ ${containerID}:home/TestEnvironment/TestInputs/
docker cp TestOutputs/ ${containerID}:home/TestEnvironment/TestOutputs/
docker cp answer.py ${containerID}:home/TestEnvironment/answer.py
docker cp clean.py ${containerID}:home/TestEnvironment/clean.py

docker exec ${containerID} sh -c "cd home/TestEnvironment/ && ./makeReport.sh"

docker cp ${containerID}:home/TestEnvironment/report.txt reportFromPySandbox.txt

docker kill ${containerID}

docker rm ${containerID}

