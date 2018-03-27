import React, {Component} from 'react';
import {StyleSheet, StatusBar} from 'react-native';
import { Container, Content, Text, Button, View, Icon, Header, Left, Right, Title, Body } from 'native-base';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Actions } from 'react-native-router-flux';
import * as Progress from 'react-native-progress';

import baseTheme from '../../../theme'
import { saveAnswer } from '../../../actions/api';
import { setAnswer } from '../../../actions/coreActions';

import SurveyTextInput from '../components/SurveyTextInput'
import SurveyBoolSelector from '../components/SurveyBoolSelector'
import SurveySingleSelector from '../components/SurveySingleSelector'
import SurveyMultiSelector from '../components/SurveyMultiSelector'
import SurveyImageSelector from '../components/SurveyImageSelector'
import SurveyTableInput from '../components/SurveyTableInput'
import DrawingBoard from '../../drawing/components/DrawingBoard';
import AudioRecord from '../../../components/audio/AudioRecord';

class SurveyQuestionScreen extends Component {
  constructor(props) {
    super(props)
  }

  onInputAnswer = (result, data=undefined, final=false) => {
    let {questionIndex, survey:{questions}, answers, setAnswer} = this.props
    let answer = {
      result,
      time: (new Date()).getTime()
    }
    answers[questionIndex] = answer
    setAnswer({answers})
    if(final)
      setTimeout(() => { this.nextQuestion() }, 500)
  }

  nextQuestion = () => {
    let {questionIndex, survey, answers} = this.props;
    let {questions} = survey;
    let condition_question_index, condition_choice;
    // Skip question does not match condition
    do {
      questionIndex = questionIndex + 1
      if (questionIndex<questions.length) {
        condition_question_index = questions[questionIndex].condition_question_index;
        condition_choice = questions[questionIndex].condition_choice;
      } else {
        break;
      }
    }while(condition_question_index>-1 && answers[condition_question_index].result != condition_choice);

    if(questionIndex<questions.length) {
      Actions.replace("survey_question", { questionIndex:questionIndex})
    } else {
      Actions.replace("survey_"+ survey.mode + "_summary")
    }
    
  }

  prevQuestion = () => {
    let {questionIndex, survey} = this.props
    let {questions, answers} = survey
    questionIndex = questionIndex - 1

    if(questionIndex>=0) {
      Actions.replace("survey_question", { questionIndex:questionIndex })
    } else {
      Actions.pop()
    }
  }

  renderHeader() {
    const { act } = this.props
    return (<Header>
      <Left>
        <Button transparent onPress={() => this.prevQuestion()}>
        <Icon name="arrow-back" />
        </Button>
      </Left>
      <Body style={{flex:2}}>
          <Title>{act.title}</Title>
      </Body>
      <Right>
        <Button transparent onPress={() => this.nextQuestion()}>
        <Icon name="arrow-forward" />
        </Button>
      </Right>
    </Header>);
  }

  renderContent() {
    const { questionIndex, survey, answers} = this.props;
    let question = survey.questions[questionIndex];
    let answer = answers[questionIndex] && answers[questionIndex].result;
    const length = survey.questions.length
    const index = questionIndex + 1
    const progressValue = index/length

    let scroll = true;
    let comp = (<View></View>);
    
    if(survey.mode == 'basic') {
      switch(question.type) {
        case 'text':
          comp = (<SurveyTextInput onSelect={this.onInputAnswer} data={{question, answer}} />);
          break;
        case 'bool':
          comp = (<SurveyBoolSelector onSelect={this.onInputAnswer} data={{question, answer}}/>);
          break;
        case 'single_sel':
          comp = (<SurveySingleSelector onSelect={this.onInputAnswer} data={{question, answer}}/>);
          break;
        case 'multi_sel':
          comp = (<SurveyMultiSelector onSelect={this.onInputAnswer} data={{question, answer}}/>);
          break;
        case 'image_sel':
          comp = (<SurveyImageSelector onSelect={this.onInputAnswer} data={{question, answer}}/>);
          break;
        case 'drawing':
          scroll = false;
          comp = (
          <View>
            <Text>{question.title}</Text>
            <DrawingBoard source={question.image_url && {uri: question.image_url}} ref={board => {this.board = board}} autoStart lines={answer.lines}/>
            <View><Left><Button onPress={this.saveDrawing}><Text>Save</Text></Button></Left>
            <Right><Button onPress={this.resetDrawing}><Text>Reset</Text></Button></Right></View>
          </View>);
          break;
        case 'audio':
          comp = (
            <View>
              <Text>{question.title}</Text>
              <AudioRecord onRecordFile={(filePath)=>this.onInputAnswer(filePath)} path={answer}/>
            </View>
          );
          break;
      }
    } else {
      comp = (<SurveyTableInput onSelect={this.onInputAnswer} data={{question, answer}}/>);
    }

    return (<Content padder style={baseTheme.content} scrollEnabled={scroll}>
      {comp}
      <View padder style={{marginTop: 20}}>
        <Progress.Bar progress={progressValue} width={null} height={20}/>
        <Text style={{textAlign:'center'}}>{`${index}/${length}`}</Text>
      </View>
      </Content>);
  }

  saveDrawing = () => {
    let answer = this.board.save();
    this.onInputAnswer(answer, null, true)
  }

  render() {
    return (
      <Container>
        { this.renderHeader() }
        { this.renderContent() }
      </Container>
    )
  }
}

export default connect(state => ({
    act: state.core.act,
    survey: state.core.act.act_data,
    answers: state.core.answer && state.core.answer.answers || [],
  }),
  (dispatch) => bindActionCreators({saveAnswer, setAnswer}, dispatch)
)(SurveyQuestionScreen);
