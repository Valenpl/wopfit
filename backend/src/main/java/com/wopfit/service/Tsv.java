package com.wopfit.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.ClassPathResource;

/** Lee un .tsv de resources: una fila por línea, columnas separadas por tab. Saltea las líneas vacías y las que empiezan con #. */
final class Tsv {
    private Tsv() {}

    static List<String[]> rows(String path) throws IOException {
        List<String[]> out = new ArrayList<>();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                if (line.isBlank() || line.startsWith("#")) continue;
                out.add(line.split("\t", -1));
            }
        }
        return out;
    }
}
