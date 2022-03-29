p1=report_creator.so
p2=proof_of_concept
ps=${p1} ${p2}

.PHONY: all clean

all: ${ps}

${p1}: report_creator.c
	g++ -fPIC -shared $^ -o $@

${p2}: proof_of_concept.cc
	g++ $^ -ldl -o $@

clean:
	@rm ${ps}

