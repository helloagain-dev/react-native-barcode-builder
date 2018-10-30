import React, { Component } from 'react';
import { View, ART, Text } from 'react-native';
import PropTypes from 'prop-types';

import barcodes from 'jsbarcode/src/barcodes';

const { Surface, Shape } = ART;

export default class Barcode extends Component {
  static propTypes = {
    /* what the barCode stands for */
    value: PropTypes.string,
    /* Select which barcode type to use */
    format: PropTypes.oneOf(Object.keys(barcodes)),
    /* Overide the text that is diplayed */
    text: PropTypes.string,
    /* The width option is the width of the whole barcode.
    If 0 or not set, the barcode self-aligns. */
    width: PropTypes.number,
    /* The height of the barcode. */
    height: PropTypes.number,
    /* Set the color of the bars */
    lineColor: PropTypes.string,
    /* Set the color of the text. */
    textColor: PropTypes.string,
    /* Set the font of the text */
    textFont: PropTypes.string,
    /* Set the background of the barcode. */
    background: PropTypes.string,
    /* Handle error for invalid barcode of selected format */
    onError: PropTypes.func,
  };

  static defaultProps = {
    value: null,
    format: 'CODE128',
    text: null,
    width: 0,
    height: 100,
    lineColor: '#000000',
    textColor: '#000000',
    textFont: 'System',
    background: '#ffffff',
    onError: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      bars: [],
      width: this.props.width,
    };
  }

  componentWillReceiveProps() {
    this.update();
  }

  update = () => {
    const encoder = barcodes[this.props.format];
    const encoded = this.encode(this.props.value, encoder, this.props);

    if (encoded) {
      this.setState({
        bars: this.drawSvgBarCode(encoded, {
          ...this.props,
          width: this.state.width / encoded.data.length,
        }),
      });
    }
  };

  drawRect(x, y, width, height) {
    return `M${x},${y}h${width}v${height}h-${width}z`;
  }

  drawSvgBarCode(encoding, options = {}) {
    const rects = [];
    // binary data of barcode
    const binary = encoding.data;

    let barWidth = 0;
    let x = 0;
    const yFrom = 0;

    for (let b = 0; b < binary.length; b++) {
      x = b * options.width;
      if (binary[b] === '1') {
        barWidth++;
      } else if (barWidth > 0) {
        rects[rects.length] = this.drawRect(
          x - options.width * barWidth,
          yFrom,
          options.width * barWidth,
          options.height
        );
        barWidth = 0;
      }
    }

    // Last draw is needed since the barcode ends with 1
    if (barWidth > 0) {
      rects[rects.length] = this.drawRect(
        x - options.width * (barWidth - 1),
        yFrom,
        options.width * barWidth,
        options.height
      );
    }

    return rects;
  }

  // encode() handles the Encoder call and builds the binary string to be rendered
  encode(text, Encoder, options) {
    // Ensure that text is a string
    text = '' + text;

    let encoder;

    try {
      encoder = new Encoder(text, options);
    } catch (error) {
      // If the encoder could not be instantiated, throw error.
      if (this.props.onError) {
        this.props.onError(new Error('Invalid barcode format.'));
        return null;
      }

      throw new Error('Invalid barcode format.');
    }

    // If the input is not valid for the encoder, throw error.
    if (!encoder.valid()) {
      if (this.props.onError) {
        this.props.onError(new Error('Invalid barcode for selected format.'));
        return null;
      }

      throw new Error('Invalid barcode for selected format.');
    }

    // Make a request for the binary data (and other infromation) that should be rendered
    // encoded stucture is {
    //  text: 'xxxxx',
    //  data: '110100100001....'
    // }
    const encoded = encoder.encode();

    return encoded;
  }

  render() {
    let containerStyle = { };

    if (this.props.width === 0) {
      containerStyle = {
        flex: 1,
        alignSelf: 'stretch',
      };
    } else {
      containerStyle = {
        width: this.props.width,
      };
    }

    return (
      <View
        style={{
          ...containerStyle,
          alignItems: 'center',
          backgroundColor: this.props.background,
          paddingLeft: 15,
          paddingRight: 15,
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 10,
        }}
        onLayout={e => {
          this.setState({
            width: e.nativeEvent.layout.width - 30,
          });
          this.update();
        }}
      >
        <Surface height={this.props.height} width={this.state.width}>
          <Shape d={this.state.bars} fill={this.props.lineColor} />
        </Surface>
        {
          this.props.text && (
            <Text
              style={{
                fontSize: 15,
                marginTop: 5,
                color: this.props.textColor,
                width: this.state.width,
                textAlign: 'center',
                fontFamily: this.props.textFont,
              }}
            >
              {this.props.text}
            </Text>
          )
        }
      </View>
    );
  }
}
