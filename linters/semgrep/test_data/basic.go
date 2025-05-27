package bad_code

import (
	"crypto/md5"
)

func Md5Sum(text string) string {
	hasher := md5.New()
	return ""
}

func foo() {
	// Note that the Go parser parses this to a Cast of a ParenExpr
	x := f([]int("foo"))

	// ruleid: cast-symbol-prop
	sink(x)
}
