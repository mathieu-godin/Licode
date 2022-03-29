#include <dlfcn.h>
#include <string>
#include <iostream>
#include <chrono>

int main(int, char *[]) {
  void *handle = dlopen("./report_creator.so", RTLD_LAZY);

  bool (*createReport)();

  createReport = (bool (*)())dlsym(handle, "createReport");

  auto start = std::chrono::high_resolution_clock::now();
  bool res = createReport();
  auto stop = std::chrono::high_resolution_clock::now();

  auto duration = std::chrono::duration_cast<std::chrono::microseconds>(stop - start);
  std::cout << (res ? "true: " : "false: ") << duration.count() << std::endl;

  return 0;
}
