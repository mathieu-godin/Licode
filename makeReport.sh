#!/bin/bash

reportName=report.txt
standardOutputName=standardOutput.txt
standardErrorName=standardError.txt
outputName=output.txt
inputExt=in
outputExt=out
inputDir=TestInputs
outputDir=TestOutputs

> "${reportName}"
> "${standardOutputName}"
> "${standardErrorName}"
> "${outputName}"

echo "[" >> "${reportName}"
for input in "${inputDir}"/*."${inputExt}"
do
  base=$(basename ${input})
  pref=${base%.${inputExt}}
  output="${outputDir}/${pref}.${outputExt}"
  if diff <(cat "${input}" | python3 answer.py | python3 clean.py) <(cat "${output}" | python3 cleanOutput.py) >/dev/null; then
          echo "{\"testName\": \"${pref}\", \"passed\": true}," >> "${reportName}"
  else
          echo "{\"testName\": \"${pref}\", \"passed\": false}," >> "${reportName}"
  fi
done
echo "]" >> "${reportName}"

input=customInput.in
cat "${input}" | python3 answerCustomInput.py > "${standardOutputName}" 2> "${standardErrorName}"
cat "${input}" | python3 answer.py | python3 clean.py > "${outputName}"
