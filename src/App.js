import './App.css';
import { useEffect, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { IconContext } from 'react-icons';
import { SiDropbox, SiTodoist } from 'react-icons/si';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TodoistApi } from '@doist/todoist-api-typescript';
import {
  MdDarkMode
} from 'react-icons/md';
import {
  // Badge,
  // Box,
  Button,
  // Inline,
  Loading,
  Stack,
  SwitchField,
  // Text
} from '@doist/reactist';

const api = new TodoistApi('ee38f15a1bb4c356976dd5bffdcc6520ecf5c91a');
document.body.style.overflow = "hidden";
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    window.callBTT('trigger_named', {trigger_name: '', closeFloatingWebView:1});
  }
});

// bttweb://update_trigger/?uuid=045B775D-C4A8-46D6-8574-EBF3C5C2BD96&json=%7B%22BTTTouchBarButtonName%22%3A%22Hello%22%7D
let count = 0;
async function incrementTask() {
  count++;
  console.log(count);
  let updateWidget = {
      'BTTTouchBarButtonName': String(count)
  };
  window.callBTT('update_trigger',
      {uuid: '045B775D-C4A8-46D6-8574-EBF3C5C2BD96',
      json: JSON.stringify(updateWidget)
      });
}

const TaskDropArea = ({index, topHalf, ghost, setDrop}) => {
  const [, drop] = useDrop(() => ({
    accept: 'task',
    drop: () => setDrop(null),
    hover: () => setDrop(index + (topHalf ? 0 : 1)),
  }));
  return <div ref={drop}
    style={{
      height: ghost ? "100%" : "50%",
      width: "100%",
      // backgroundColor: topHalf ? "red" : "blue",
      position: "absolute",
      [topHalf ? 'top' : 'bottom']: "0"
    }}
  >&nbsp;</div>
}

const Task = ({index, task, isGhost, setDrop}) => {
  const [{isDragging}, drag] = useDrag(() => ({
    type: 'task',
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  if (isGhost)
    return (<div className="taskWrapper">
      <div className="taskBody" style={{backgroundColor: "lightgray", opacity: 0.5}}>
        &nbsp;
        <TaskDropArea index={index} topHalf={true} ghost={true} setDrop={setDrop} />
      </div>
    </div>);
  if (isDragging) {
  }
  return (<div ref={drag} className="taskWrapper"
    style={{
      textIndent: isDragging? "-9999px" : 0,
      opacity: isDragging ? 0.5 : 1
    }}>
      <div className="taskBody"
        style={{
          backgroundColor: isDragging ? "lightgray" : "white",
        }}>
        {task.content}
      </div>
      {
        !isDragging ?
        <><TaskDropArea index={index} topHalf={true} setDrop={setDrop} />
        <TaskDropArea index={index} topHalf={false} setDrop={setDrop} /></>
        : null
      }
    <div />
  </div>);
}

const TaskList = ({tasks}) => {
  const [ghostIndex, setGhostIndex] = useState(null);
  // const duration = {duration: 0}
  const [list, enableAnimations] = useAutoAnimate({duration: 200});
  useEffect(() => {
    // setTimeout(() => duration.duration = 200, 1000)
  }, [])
  let taskArr = tasks.map((task, index) => <Task key={task.id} index={index} task={task} setDrop={setGhostIndex} />);
  if (ghostIndex)
    taskArr.splice(ghostIndex, 0, <Task isGhost={true} key={-1} index={ghostIndex} setDrop={setGhostIndex} /> );
  return <DndProvider backend={HTML5Backend}>
    <div ref={list} className="taskList">
      {taskArr}
    </div>
  </DndProvider>
}

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
    setTimeout(() => window.callBTT('get_string_variable', { variable_name: 'cachedTasks' })
      .then(result => setTasks(JSON.parse(result) ?? [])), 0);
    } catch (error) {
      console.error(error);
    }
    api.getProjects()
      .then(projects => projects.find(project => project.name === "Touch Bar Queue").id)
      .then(projectId => {
        return api.getTasks()
          .then(tasks => tasks.filter(task => task.projectId === projectId))
        })
      .then(tasks => {
        setTasks(tasks);
        window.callBTT('set_string_variable', {
          variable_name: 'cachedTasks',
          to: JSON.stringify(tasks)
        });
        setLoading(false);
      })
  }, [loading]);
  return (<div className="wrapper">
    <header className="BTTDraggable">
      <IconContext.Provider value={{color: "red", size: "80%" }}>
        <Button icon={<SiTodoist />} />
        {loading ? <Loading /> : null}
      </IconContext.Provider>
    </header>
    <TaskList tasks={tasks} setTasks={setTasks} />
  </div>);
};

export default App;
