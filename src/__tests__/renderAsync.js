import * as React from 'react'
import {renderAsync, screen} from '../'

const isReact19 = React.version.startsWith('19.')

const testGateReact19 = isReact19 ? test : test.skip

async function AsyncHelloWorld() {
  return <div data-testid="hello">Hello World</div>
}

async function AsyncGreeting({name}) {
  return <div data-testid="greeting">Hello {name}</div>
}

async function AsyncDataLoader() {
  const data = await Promise.resolve({items: ['a', 'b', 'c']})
  return (
    <ul data-testid="list">
      {data.items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

async function AsyncChild() {
  return <span data-testid="child">Child Content</span>
}

async function AsyncParent() {
  return (
    <div data-testid="parent">
      <AsyncChild />
    </div>
  )
}

async function AsyncDeeplyNested() {
  return (
    <div data-testid="level-1">
      <AsyncLevel2 />
    </div>
  )
}

async function AsyncLevel2() {
  return (
    <div data-testid="level-2">
      <AsyncLevel3 />
    </div>
  )
}

async function AsyncLevel3() {
  return <div data-testid="level-3">Deep Content</div>
}

async function AsyncSiblings() {
  return (
    <div data-testid="siblings">
      <AsyncGreeting name="Alice" />
      <AsyncGreeting name="Bob" />
    </div>
  )
}

function SyncWrapper({children}) {
  return <div data-testid="wrapper">{children}</div>
}

async function AsyncWithSyncWrapper() {
  return (
    <SyncWrapper>
      <AsyncChild />
    </SyncWrapper>
  )
}

async function AsyncWithFragment() {
  return (
    <>
      <div data-testid="frag-a">A</div>
      <div data-testid="frag-b">B</div>
    </>
  )
}

async function AsyncThatThrows() {
  throw new Error('Server component error')
}

describe('renderAsync', () => {
  test('renders a simple async component', async () => {
    await renderAsync(<AsyncHelloWorld />)
    expect(screen.getByTestId('hello')).toHaveTextContent('Hello World')
  })

  test('renders an async component with props', async () => {
    await renderAsync(<AsyncGreeting name="Alice" />)
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello Alice')
  })

  test('renders an async component that awaits data', async () => {
    await renderAsync(<AsyncDataLoader />)
    const list = screen.getByTestId('list')
    expect(list.children).toHaveLength(3)
    expect(list).toHaveTextContent('abc')
  })

  test('resolves nested async components', async () => {
    await renderAsync(<AsyncParent />)
    expect(screen.getByTestId('parent')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  test('resolves deeply nested async components', async () => {
    await renderAsync(<AsyncDeeplyNested />)
    expect(screen.getByTestId('level-1')).toBeInTheDocument()
    expect(screen.getByTestId('level-2')).toBeInTheDocument()
    expect(screen.getByTestId('level-3')).toHaveTextContent('Deep Content')
  })

  test('resolves sibling async components', async () => {
    await renderAsync(<AsyncSiblings />)
    expect(screen.getByTestId('siblings').children).toHaveLength(2)
  })

  test('resolves async component passed as children to sync wrapper', async () => {
    await renderAsync(<AsyncWithSyncWrapper />)
    expect(screen.getByTestId('wrapper')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  test('resolves async components inside fragments', async () => {
    await renderAsync(<AsyncWithFragment />)
    expect(screen.getByTestId('frag-a')).toHaveTextContent('A')
    expect(screen.getByTestId('frag-b')).toHaveTextContent('B')
  })

  test('works with sync components (passthrough)', async () => {
    function SyncComponent() {
      return <div data-testid="sync">Sync Content</div>
    }
    await renderAsync(<SyncComponent />)
    expect(screen.getByTestId('sync')).toHaveTextContent('Sync Content')
  })

  test('works with plain HTML elements', async () => {
    await renderAsync(<div data-testid="plain">Plain</div>)
    expect(screen.getByTestId('plain')).toHaveTextContent('Plain')
  })

  test('supports rerender with async components', async () => {
    const {rerender} = await renderAsync(<AsyncGreeting name="Alice" />)
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello Alice')

    await rerender(<AsyncGreeting name="Bob" />)
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello Bob')
  })

  test('propagates errors from async components', async () => {
    await expect(renderAsync(<AsyncThatThrows />)).rejects.toThrow(
      'Server component error',
    )
  })

  test('supports render options (container)', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    await renderAsync(<AsyncHelloWorld />, {container})

    expect(container.querySelector('[data-testid="hello"]')).toHaveTextContent(
      'Hello World',
    )

    document.body.removeChild(container)
  })

  test('supports wrapper option', async () => {
    const Wrapper = ({children}) => (
      <div data-testid="test-wrapper">{children}</div>
    )

    await renderAsync(<AsyncHelloWorld />, {wrapper: Wrapper})

    expect(screen.getByTestId('test-wrapper')).toBeInTheDocument()
    expect(screen.getByTestId('hello')).toHaveTextContent('Hello World')
  })

  test('async component with mixed sync and async children', async () => {
    function SyncChild() {
      return <span data-testid="sync-child">Sync</span>
    }

    async function MixedParent() {
      return (
        <div data-testid="mixed">
          <SyncChild />
          <AsyncChild />
        </div>
      )
    }

    await renderAsync(<MixedParent />)
    expect(screen.getByTestId('mixed')).toBeInTheDocument()
    expect(screen.getByTestId('sync-child')).toHaveTextContent('Sync')
    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  test('resolves async components passed as non-children props', async () => {
    async function AsyncSidebar() {
      return <nav data-testid="async-sidebar">Sidebar Content</nav>
    }

    async function AsyncHeader() {
      return <header data-testid="async-header">Header Content</header>
    }

    function Layout({sidebar, header, children}) {
      return (
        <div data-testid="layout">
          {header}
          <aside>{sidebar}</aside>
          <main>{children}</main>
        </div>
      )
    }

    await renderAsync(
      <Layout sidebar={<AsyncSidebar />} header={<AsyncHeader />}>
        <div data-testid="main-content">Main</div>
      </Layout>,
    )
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    expect(screen.getByTestId('async-sidebar')).toHaveTextContent(
      'Sidebar Content',
    )
    expect(screen.getByTestId('async-header')).toHaveTextContent(
      'Header Content',
    )
    expect(screen.getByTestId('main-content')).toHaveTextContent('Main')
  })

  test('resolves async component in Suspense fallback prop', async () => {
    async function AsyncFallback() {
      return <div data-testid="resolved-fallback">Resolved Fallback</div>
    }

    function SyncContent() {
      return <div data-testid="content">Content</div>
    }

    await renderAsync(
      <React.Suspense fallback={<AsyncFallback />}>
        <SyncContent />
      </React.Suspense>,
    )
    expect(screen.getByTestId('content')).toHaveTextContent('Content')
  })

  test('returns standard render result properties', async () => {
    const {container, baseElement, debug, unmount, asFragment} =
      await renderAsync(<AsyncHelloWorld />)

    expect(container).toBeInstanceOf(HTMLElement)
    expect(baseElement).toBe(document.body)
    expect(typeof debug).toBe('function')
    expect(typeof unmount).toBe('function')
    expect(typeof asFragment).toBe('function')
    expect(asFragment()).toBeInstanceOf(DocumentFragment)
  })
})

describe('renderAsync with use()', () => {
  testGateReact19(
    'renders component that calls use() with a promise prop',
    async () => {
      function UseDataLoader({dataPromise}) {
        const data = React.use(dataPromise)
        return <div data-testid="use-data">{data.message}</div>
      }

      await renderAsync(
        <UseDataLoader
          dataPromise={Promise.resolve({message: 'loaded via use'})}
        />,
      )
      expect(screen.getByTestId('use-data')).toHaveTextContent('loaded via use')
    },
  )

  testGateReact19('renders component using use() with list data', async () => {
    function UseFetchComponent({itemsPromise}) {
      const data = React.use(itemsPromise)
      return (
        <ul data-testid="use-list">
          {data.items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    }

    await renderAsync(
      <UseFetchComponent
        itemsPromise={Promise.resolve({items: ['x', 'y', 'z']})}
      />,
    )
    const list = screen.getByTestId('use-list')
    expect(list.children).toHaveLength(3)
  })

  testGateReact19('renders async parent with use()-based child', async () => {
    function UseChild({textPromise}) {
      const data = React.use(textPromise)
      return <span data-testid="use-child">{data.text}</span>
    }

    async function AsyncParentWithUseChild() {
      const title = await Promise.resolve('Async Title')
      return (
        <div data-testid="async-use-parent">
          <h1>{title}</h1>
          <UseChild textPromise={Promise.resolve({text: 'from use'})} />
        </div>
      )
    }

    await renderAsync(<AsyncParentWithUseChild />)
    expect(screen.getByTestId('async-use-parent')).toBeInTheDocument()
    expect(screen.getByTestId('use-child')).toHaveTextContent('from use')
  })

  testGateReact19('renders use() with context', async () => {
    const ThemeContext = React.createContext('light')

    function ThemeReader() {
      const theme = React.use(ThemeContext)
      return <div data-testid="theme">{theme}</div>
    }

    const Wrapper = ({children}) => (
      <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
    )

    await renderAsync(<ThemeReader />, {wrapper: Wrapper})
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  testGateReact19('supports rerender with use() components', async () => {
    function UseGreeting({namePromise}) {
      const name = React.use(namePromise)
      return <div data-testid="use-greeting">Hello {name}</div>
    }

    const {rerender} = await renderAsync(
      <UseGreeting namePromise={Promise.resolve('Alice')} />,
    )
    expect(screen.getByTestId('use-greeting')).toHaveTextContent('Hello Alice')

    await rerender(<UseGreeting namePromise={Promise.resolve('Bob')} />)
    expect(screen.getByTestId('use-greeting')).toHaveTextContent('Hello Bob')
  })

  testGateReact19(
    'renders use() component wrapped in explicit Suspense',
    async () => {
      function SlowComponent({dataPromise}) {
        const data = React.use(dataPromise)
        return <div data-testid="slow">{data.value}</div>
      }

      const dataPromise = Promise.resolve({value: 'resolved'})

      await renderAsync(
        <React.Suspense fallback={<div>Loading...</div>}>
          <SlowComponent dataPromise={dataPromise} />
        </React.Suspense>,
      )
      expect(screen.getByTestId('slow')).toHaveTextContent('resolved')
    },
  )
})
