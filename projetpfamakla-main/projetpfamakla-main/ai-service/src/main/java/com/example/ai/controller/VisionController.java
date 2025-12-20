package com.example.ai.controller;

import ai.djl.modality.Classifications;
import com.example.ai.service.FoodRecognitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vision")
@CrossOrigin("*")
public class VisionController {

    private final FoodRecognitionService foodRecognitionService;

    public VisionController(
            FoodRecognitionService foodRecognitionService
    ) {
        this.foodRecognitionService = foodRecognitionService;
    }

    @PostMapping("/predict-food")
    public ResponseEntity<List<String>> predictFood(@RequestParam("image") MultipartFile image) {
        try {
            List<Classifications.Classification> results = foodRecognitionService.predict(image);
            List<String> formattedResults = results.stream()
                    .map(c -> c.getClassName() + " (" + String.format("%.2f", c.getProbability() * 100) + "%)")
                    .collect(Collectors.toList());
            return ResponseEntity.ok(formattedResults);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
