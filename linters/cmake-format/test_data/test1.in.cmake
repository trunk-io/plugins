cmake_minimum_required(VERSION 3.22)

project(
  myproject
      VERSION 1.0
  DESCRIPTION "Testing if cmake-format works"
  LANGUAGES C CXX
)

add_executable(

  myproject
  
  ${PROJECT_SOURCE_DIR}/src/main.cpp
)
