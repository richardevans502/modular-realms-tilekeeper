#!/usr/bin/env bash
set -e

# Fix expo-modules-core for React Native 0.81.5 compatibility
# RN 0.81.5's Java Promise interface uses @Nullable String for 'code' parameter

PROMISE_KT="node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/Promise.kt"
KPROMISE_KT="node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/KPromiseWrapper.kt"

if [ -f "$PROMISE_KT" ]; then
  # The anonymous bridge Promise implementation must match RN 0.81.5's interface
  # which has @Nullable String code (Kotlin sees as String?)
  # But KPromiseWrapper.kt passes code: String? to bridgePromise.reject
  # We need to ensure KPromiseWrapper handles null code
  echo "[postinstall] Patching KPromiseWrapper.kt for RN 0.81.5 compat"
fi

if [ -f "$KPROMISE_KT" ]; then
  # Replace bridgePromise.reject(code, message, cause) with null-safe version
  sed -i 's/bridgePromise.reject(code, message, cause)/bridgePromise.reject(code ?: "UnknownCode", message, cause)/g' "$KPROMISE_KT"
  echo "[postinstall] Patched KPromiseWrapper.kt"
else
  echo "[postinstall] Warning: KPromiseWrapper.kt not found"
fi

# Ensure expo-module-gradle-plugin has build.gradle.kts
PLUGIN_DIR="node_modules/expo-modules-core/expo-module-gradle-plugin"
if [ ! -f "$PLUGIN_DIR/build.gradle.kts" ]; then
  cat > "$PLUGIN_DIR/build.gradle.kts" << 'EOF'
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm")
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

dependencies {
  implementation(gradleApi())
  compileOnly("com.android.tools.build:gradle:8.5.0")
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_11)
  }
}

group = "expo.modules"

gradlePlugin {
  plugins {
    create("expoModuleGradlePlugin") {
      id = "expo-module-gradle-plugin"
      implementationClass = "expo.modules.plugin.ExpoModulesGradlePlugin"
    }
  }
}
EOF
  echo "[postinstall] Created build.gradle.kts"
else
  echo "[postinstall] build.gradle.kts already exists"
fi

echo "[postinstall] Done"
