package com.example.ai.service;

import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.Classifications;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.modality.cv.translator.ImageClassificationTranslator;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelZoo;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
public class FoodRecognitionService {

    private ZooModel<Image, Classifications> model;

    @PostConstruct
    public void init() throws ModelException, IOException {
        // Load a pre-trained ResNet50 model from DJL Model Zoo
        Criteria<Image, Classifications> criteria = Criteria.builder()
                .setTypes(Image.class, Classifications.class)
                .optApplication(ai.djl.Application.CV.IMAGE_CLASSIFICATION)
                .optGroupId("ai.djl.pytorch")
                .optArtifactId("resnet")
                .optFilter("layers", "50")
                .optProgress(new ProgressBar())
                .build();

        this.model = ModelZoo.loadModel(criteria);
    }

    public List<Classifications.Classification> predict(MultipartFile file) throws IOException, ModelException, ai.djl.translate.TranslateException {
        try (InputStream is = file.getInputStream();
             Predictor<Image, Classifications> predictor = model.newPredictor()) {
            
            Image image = ImageFactory.getInstance().fromInputStream(is);
            Classifications result = predictor.predict(image);
            
            // Return top 5 results
            return result.topK(5);
        }
    }
}
