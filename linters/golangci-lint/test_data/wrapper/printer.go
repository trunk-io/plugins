package wrapper

import (
	"fmt"
)

func PrintContents(w Wrapper) {
	fmt.Println(w.Str)
}

// Wrapper2 is missing a type definition that would be imported from another file
func PrintContents2(w Wrapper2) {
	fmt.Println(w.Str)
}
