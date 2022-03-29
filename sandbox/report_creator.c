#include <unistd.h>
#include <sys/wait.h>

extern "C" {
  //all files should be copied before this call
  //will probably pass language info via files as well
  bool createReport () {
    int pid = fork();
    if(pid == 0) {
      //makeReport is a bash script that spins up a
      //docker container and copies all code and
      //test input/output to it.
      //The container then runs the code on the inputs
      //against the outputs and generates a simple report
      //  1: test1 true
      //  2: test2 false
      //  ...
      char bin[] = "./makeReport.sh";
      char *args[] = {bin, NULL};
      execvp(bin, args); //replaces this process with the makeReport call
      //should never get here, not sure how to communicate error to calling code
      return false;
    }
    wait(NULL);
    return true;
  }
};


