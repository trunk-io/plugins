plugins {
    // Java deps
    id("org.jetbrains.kotlin.jvm") version "1.8.10"
    `java-library`

    // Detekt
    id("io.gitlab.arturbosch.detekt").version("1.22.0")
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
