import DjoppieLoading from './DjoppieLoading';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading component that displays an animated Djoppie robot
 * with console-style loading message.
 */
const Loading = ({ message, fullScreen = false }: LoadingProps) => {
  return <DjoppieLoading message={message} fullScreen={fullScreen} />;
};

export default Loading;
