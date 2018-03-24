import os
from keras.models import Sequential, load_model
from keras.layers import Conv2D, MaxPooling2D
from keras.layers import Activation, Dropout, Flatten, Dense
from keras.preprocessing.image import ImageDataGenerator, img_to_array, load_img
from flask import Flask, render_template, request, redirect
import numpy as np
import json

app = Flask(__name__)


# Send image in a json from with the name 'image'
@app.route('/predict', methods=['POST'])
def predict():
    image = request.form['image']
    model = load_model('model.h5')
    x = img_to_array(image).resize(150, 150, 3, refcheck=False).reshape((1,) + x.shape)

    predictions = model.predict_classes(x)

    if predictions[0] == 0:
        items_formatted = {
            'prediction': 'approved'
        }
    else:
        items_formatted = {
            'prediction': 'not approved'
        }

    return items_formatted


if __name__ == '__main__':
    app.run()
