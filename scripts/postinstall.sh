#!/usr/bin/env bash
set -e

# Fix expo-modules-core Promise.kt for React Native 0.81.5 compatibility
# RN 0.81.5 uses non-nullable String for Promise reject code parameter
PROMISE_KT="node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/Promise.kt"

if [ -f "$PROMISE_KT" ]; then
  # Replace nullable String? with non-nullable String for all reject overrides
  sed -i 's/override fun reject(code: String?,/override fun reject(code: String,/g' "$PROMISE_KT"
  echo "[postinstall] Patched Promise.kt for RN 0.81.5 compat"
else
  echo "[postinstall] Warning: Promise.kt not found"
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
  echo "[postinstall] Created build.gradle.kts for expo-module-gradle-plugin"
else
  echo "[postinstall] build.gradle.kts already exists"
fi

echo "[postinstall] Done"
