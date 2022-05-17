USE [Apps4Maps]
GO

IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbValkartaVisitorLog]') AND type in (N'U'))
DROP TABLE [dbo].[tbValkartaVisitorLog]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tbValkartaVisitorLog](
	[VisitorLogId] INT NOT NULL IDENTITY PRIMARY KEY ,
	[UserAgent] NVARCHAR(500),
	[DateVisited] DATETIME,
	[ScreenWidth] INT,
	[ScreenHeight] INT
)
GO

