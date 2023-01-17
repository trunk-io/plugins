plugins {
    // Java deps
    id("org.jetbrains.kotlin.jvm") version "1.5.31"
    `java-library`

    // Detekt
    id("io.gitlab.arturbosch.detekt").version("1.20.0-RC1")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("org.jetbrains.kotlin:kotlin-bom"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
}

detekt {
    config = files("potential-bugs.detekt.yaml")

    reports {
        sarif.enabled = true
    }
}
